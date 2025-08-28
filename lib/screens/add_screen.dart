import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/vehicle.dart';
import '../models/refuel.dart';
import '../services/session_manager.dart';

class AddScreen extends StatefulWidget {
  final Refuel? refuel;
  final VoidCallback? onSaved;
  final bool standalone;

  AddScreen({this.refuel, this.onSaved, this.standalone = false});

  @override
  _AddScreenState createState() => _AddScreenState();
}

class _AddScreenState extends State<AddScreen> {
  final _formKey = GlobalKey<FormState>();

  String? _selectedVehicleId;
  FuelType? _selectedFuelType;
  final TextEditingController _litersController = TextEditingController();
  final TextEditingController _pricePerLiterController =
      TextEditingController();
  final TextEditingController _totalPriceController = TextEditingController();
  final TextEditingController _mileageController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();

  final FocusNode _litersFocus = FocusNode();
  final FocusNode _pricePerLiterFocus = FocusNode();
  final FocusNode _totalPriceFocus = FocusNode();

  bool _initialized = false;
  bool _isRecalculating = false;

  @override
  void initState() {
    super.initState();
    _litersController.addListener(_recalculate);
    _pricePerLiterController.addListener(_recalculate);
    _totalPriceController.addListener(_recalculate);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    final session = Provider.of<SessionManager>(context);
    if (widget.refuel != null) {
      final r = widget.refuel!;
      _selectedVehicleId = r.vehicleId;
      _selectedFuelType = r.fuelType;
      _litersController.text = r.liters.toString();
      _pricePerLiterController.text = r.pricePerLiter.toString();
      _totalPriceController.text = r.totalPrice.toString();
      _mileageController.text = r.mileage.toString();
      if (r.note != null) _noteController.text = r.note!;
    } else {
      _selectedVehicleId = session.defaultVehicle?.id;
      _selectedFuelType = session.defaultVehicle?.fuelType;
    }
    _initialized = true;
  }

  @override
  Widget build(BuildContext context) {
    final session = Provider.of<SessionManager>(context);
    final vehicles = session.vehicles;

    final form = Padding(
      padding: const EdgeInsets.all(16.0),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              DropdownButtonFormField<String>(
                decoration: InputDecoration(labelText: 'Vehicle'),
                value: _selectedVehicleId,
                items: vehicles
                    .map(
                      (vehicle) => DropdownMenuItem(
                        value: vehicle.id,
                        child: Text(vehicle.name),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedVehicleId = value;
                    final vehicle = vehicles.firstWhere((v) => v.id == value);
                    _selectedFuelType = vehicle.fuelType;
                  });
                },
                validator:
                    (value) => value == null ? 'Please select a vehicle' : null,
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<FuelType>(
                decoration: InputDecoration(labelText: 'Fuel Type'),
                value: _selectedFuelType,
                items: FuelType.values
                    .map((fuel) => DropdownMenuItem(
                          value: fuel,
                          child: Text(fuel.label),
                        ))
                    .toList(),
                onChanged: (value) => setState(() => _selectedFuelType = value),
                validator:
                    (value) => value == null ? 'Please select a fuel type' : null,
              ),
              SizedBox(height: 16),
              TextFormField(
                  controller: _litersController,
                  focusNode: _litersFocus,
                  decoration: InputDecoration(labelText: 'Liters'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _pricePerLiterController,
                  focusNode: _pricePerLiterFocus,
                  decoration: InputDecoration(labelText: 'Price per Liter'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _totalPriceController,
                  focusNode: _totalPriceFocus,
                  decoration: InputDecoration(labelText: 'Total Price'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _mileageController,
                  decoration: InputDecoration(labelText: 'Mileage'),
                  keyboardType: TextInputType.number,
                  validator: _numberValidator,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _noteController,
                  decoration: InputDecoration(labelText: 'Note'),
                  keyboardType: TextInputType.text,
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  child: Text(widget.refuel == null
                      ? 'Create Fuel Record'
                      : 'Update Fuel Record'),
                ),
                ],
              ),
            ),
          ),
        );

    if (widget.standalone) {
      return Scaffold(
        appBar: AppBar(
          title: Text(
              widget.refuel == null ? 'Add Refuel Record' : 'Edit Refuel Record'),
        ),
        body: form,
      );
    }

    return form;
  }

  String? _numberValidator(String? value) {
    if (value == null || value.isEmpty) return 'This field cannot be empty';
    if (double.tryParse(value) == null) return 'Enter a valid number';
    return null;
  }

  void _recalculate() {
    if (_isRecalculating) return;

    final liters = double.tryParse(_litersController.text);
    final price = double.tryParse(_pricePerLiterController.text);
    final total = double.tryParse(_totalPriceController.text);

    _isRecalculating = true;

    if (!_totalPriceFocus.hasFocus && liters != null && price != null) {
      _totalPriceController.text = (liters * price).toStringAsFixed(2);
    } else if (!_pricePerLiterFocus.hasFocus && liters != null && total != null) {
      _pricePerLiterController.text = (total / liters).toStringAsFixed(2);
    } else if (!_litersFocus.hasFocus && price != null && total != null) {
      _litersController.text = (total / price).toStringAsFixed(2);
    }

    _isRecalculating = false;
  }

  void _submitForm() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final session = Provider.of<SessionManager>(context, listen: false);
    final refuel = Refuel(
      id: widget.refuel?.id,
      vehicleId: _selectedVehicleId!,
      fuelType: _selectedFuelType!,
      liters: double.parse(_litersController.text),
      pricePerLiter: double.parse(_pricePerLiterController.text),
      totalPrice: double.parse(_totalPriceController.text),
      mileage: int.parse(_mileageController.text),
      note: _noteController.text.isEmpty ? null : _noteController.text,
    );

    if (widget.refuel == null) {
      await session.addRefuel(refuel);
    } else if (widget.refuel!.id != null) {
      await session.updateRefuel(widget.refuel!.id!, refuel);
    }

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Fuel record saved successfully!')),
    );
    _formKey.currentState?.reset();
    setState(() {
      _selectedVehicleId = session.defaultVehicle?.id;
      _selectedFuelType = session.defaultVehicle?.fuelType;
    });
    _litersController.clear();
    _pricePerLiterController.clear();
    _totalPriceController.clear();
    _mileageController.clear();
    _noteController.clear();

    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    } else {
      widget.onSaved?.call();
    }
  }

  @override
  void dispose() {
    _litersController.dispose();
    _pricePerLiterController.dispose();
    _totalPriceController.dispose();
    _mileageController.dispose();
    _noteController.dispose();
    _litersFocus.dispose();
    _pricePerLiterFocus.dispose();
    _totalPriceFocus.dispose();
    super.dispose();
  }
}
